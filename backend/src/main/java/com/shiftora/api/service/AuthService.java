package com.shiftora.api.service;

import com.shiftora.api.domain.AppUserEntity;
import com.shiftora.api.domain.AuthSessionEntity;
import com.shiftora.api.domain.PlatformUserEntity;
import com.shiftora.api.dto.AuthDtos.AuthUserDto;
import com.shiftora.api.dto.AuthDtos.LoginResponse;
import com.shiftora.api.repository.AppUserRepository;
import com.shiftora.api.repository.AuthSessionRepository;
import com.shiftora.api.repository.PlatformUserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
  private static final long SESSION_TTL_MS = 8L * 60 * 60 * 1000;
  private static final long LOCK_MS = 15L * 60 * 1000;
  private static final int MAX_FAILURES = 5;

  private final AppUserRepository appUsers;
  private final PlatformUserRepository platformUsers;
  private final AuthSessionRepository sessions;
  private final PasswordEncoder passwordEncoder;
  private final SecureRandom random = new SecureRandom();

  public AuthService(
      AppUserRepository appUsers,
      PlatformUserRepository platformUsers,
      AuthSessionRepository sessions,
      PasswordEncoder passwordEncoder) {
    this.appUsers = appUsers;
    this.platformUsers = platformUsers;
    this.sessions = sessions;
    this.passwordEncoder = passwordEncoder;
  }

  @Transactional
  public LoginResponse login(String email, String password) {
    String normalized = email == null ? "" : email.trim().toLowerCase();
    long now = Instant.now().toEpochMilli();
    Optional<PlatformUserEntity> platform = platformUsers.findByEmailIgnoreCase(normalized);
    if (platform.isPresent()) return loginPlatform(platform.get(), password, now);

    List<AppUserEntity> matches = appUsers.findByEmailIgnoreCase(normalized);
    if (matches.size() != 1) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return loginAppUser(matches.get(0), password, now);
  }

  @Transactional(readOnly = true)
  public Optional<AuthUserDto> authenticateToken(String token) {
    if (token == null || token.isBlank()) return Optional.empty();
    long now = Instant.now().toEpochMilli();
    return sessions.findByTokenHashAndRevokedAtIsNull(hash(token))
        .filter(session -> session.getExpiresAt() > now)
        .flatMap(session -> {
          if ("PLATFORM".equals(session.getPrincipalType())) {
            return platformUsers.findById(session.getPrincipalId())
                .filter(PlatformUserEntity::isActive)
                .map(this::toDto);
          }
          return appUsers.findById(session.getPrincipalId()).map(this::toDto);
        });
  }

  public String hashPassword(String password) {
    return passwordEncoder.encode(password);
  }

  private LoginResponse loginPlatform(PlatformUserEntity user, String password, long now) {
    if (!user.isActive()) throw new UnauthorizedException("Invalid credentials");
    checkLock(user.getLockedUntil(), now);
    if (!passwordEncoder.matches(password, user.getPasswordHash())) {
      user.setFailedLoginCount(user.getFailedLoginCount() + 1);
      if (user.getFailedLoginCount() >= MAX_FAILURES) user.setLockedUntil(now + LOCK_MS);
      platformUsers.save(user);
      throw new UnauthorizedException("Invalid credentials");
    }
    user.setFailedLoginCount(0);
    user.setLockedUntil(null);
    user.setLastLoginAt(now);
    platformUsers.save(user);
    return issueSession("PLATFORM", user.getId(), null, "platform", toDto(user), now);
  }

  private LoginResponse loginAppUser(AppUserEntity user, String password, long now) {
    checkLock(user.getLockedUntil(), now);
    if (!passwordEncoder.matches(password, user.getPasswordHash())) {
      user.setFailedLoginCount(user.getFailedLoginCount() + 1);
      if (user.getFailedLoginCount() >= MAX_FAILURES) user.setLockedUntil(now + LOCK_MS);
      appUsers.save(user);
      throw new UnauthorizedException("Invalid credentials");
    }
    user.setFailedLoginCount(0);
    user.setLockedUntil(null);
    user.setLastLoginAt(now);
    appUsers.save(user);
    return issueSession("APP", user.getId(), user.getTenantId(), roleKey(user.getRole()), toDto(user), now);
  }

  private LoginResponse issueSession(String principalType, String principalId, String tenantId, String role, AuthUserDto user, long now) {
    String token = token();
    AuthSessionEntity session = new AuthSessionEntity();
    session.setId("as-" + UUID.randomUUID().toString().substring(0, 12));
    session.setPrincipalType(principalType);
    session.setPrincipalId(principalId);
    session.setTenantId(tenantId);
    session.setTokenHash(hash(token));
    session.setRole(role);
    session.setCreatedAt(now);
    session.setLastSeenAt(now);
    session.setExpiresAt(now + SESSION_TTL_MS);
    sessions.save(session);
    return new LoginResponse(token, session.getExpiresAt(), user);
  }

  private AuthUserDto toDto(PlatformUserEntity user) {
    return new AuthUserDto(user.getEmail(), user.getName(), user.getAvatar(), "platform", null, true, List.of("platform"));
  }

  private AuthUserDto toDto(AppUserEntity user) {
    String role = roleKey(user.getRole());
    return new AuthUserDto(user.getEmail(), user.getName(), user.getAvatar(), role, user.getTenantId(), false, List.of(role));
  }

  private void checkLock(Long lockedUntil, long now) {
    if (lockedUntil != null && lockedUntil > now) {
      throw new UnauthorizedException("Account temporarily locked. Try again later.");
    }
  }

  private String roleKey(String role) {
    String upper = role == null ? "" : role.toUpperCase();
    return switch (upper) {
      case "ADMIN" -> "admin";
      case "PRINCIPAL" -> "principal";
      case "HOD" -> "hod";
      case "BEO" -> "beo";
      case "DEO" -> "deo";
      case "DIET" -> "diet";
      default -> "learner";
    };
  }

  private String token() {
    byte[] bytes = new byte[32];
    random.nextBytes(bytes);
    return "shs_" + HexFormat.of().formatHex(bytes);
  }

  private String hash(String token) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
    } catch (Exception ex) {
      throw new IllegalStateException("Unable to hash token");
    }
  }
}
