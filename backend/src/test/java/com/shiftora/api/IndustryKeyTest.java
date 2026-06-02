package com.shiftora.api;

import static org.assertj.core.api.Assertions.assertThat;

import com.shiftora.api.domain.IndustryKey;
import org.junit.jupiter.api.Test;

class IndustryKeyTest {
  @Test
  void acceptsHumanReadableIndustryAliases() {
    assertThat(IndustryKey.fromRequestValue("education")).isEqualTo(IndustryKey.edu);
    assertThat(IndustryKey.fromRequestValue("healthcare")).isEqualTo(IndustryKey.health);
    assertThat(IndustryKey.fromRequestValue("bfsi")).isEqualTo(IndustryKey.bfsi);
  }
}
