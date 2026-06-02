import { afterEach, describe, expect, it, vi } from "vitest";
import { shiftoraApi } from "./shiftora-api";

function mockFetch(body: unknown, ok = true, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("shiftoraApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads tenants from the Spring API", async () => {
    const fetchMock = mockFetch([{ id: "org-alpha", name: "Alpha School" }]);

    const tenants = await shiftoraApi.tenants();

    expect(tenants).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8081/api/tenants",
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
  });

  it("posts practice entries to the backend", async () => {
    const fetchMock = mockFetch({ id: "pe-1", tenantId: "org-alpha" }, true, 201);

    await shiftoraApi.createPractice({
      scenarioId: "edu-lesson",
      scenarioTitle: "Lesson Plan Lab",
      tenantId: "org-alpha",
      inputs: { subject: "English" },
      output: "Generated lesson",
      scores: [{ label: "Clarity", value: 90 }],
    });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toMatchObject({
      tenantId: "org-alpha",
      scenarioId: "edu-lesson",
    });
  });

  it("runs sandbox prompts through the backend API", async () => {
    const fetchMock = mockFetch({ output: "Generated", scores: [{ label: "Clarity", value: 88 }] });

    const result = await shiftoraApi.runSandbox({
      aiName: "Shiksha AI",
      scenarioTitle: "Lesson Plan Lab",
      systemPrompt: "Create a lesson plan.",
      tenantInstruction: "Use classroom-ready language.",
      scoreLabels: ["Clarity"],
      inputs: { topic: "Fractions" },
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8081/api/sandbox/run");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toMatchObject({
      scenarioTitle: "Lesson Plan Lab",
      inputs: { topic: "Fractions" },
    });
    expect(result.output).toBe("Generated");
  });

  it("loads journey and readiness configuration from backend endpoints", async () => {
    const fetchMock = mockFetch({
      activeAssignment: { id: "as-alpha-g3a-math" },
      assignments: [],
      steps: [],
    });

    await shiftoraApi.journey("org-alpha", "learner@alpha.school", "as-alpha-g3a-math");

    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8081/api/users/me/journey?tenantId=org-alpha&email=learner%40alpha.school&assignmentId=as-alpha-g3a-math",
    );
  });

  it("saves school-admin readiness templates through the backend", async () => {
    const fetchMock = mockFetch({ id: "rt-1", tenantId: "org-alpha", questions: [] });

    await shiftoraApi.saveReadinessTemplate({
      id: null,
      tenantId: "org-alpha",
      name: "Grade 3 Mathematics",
      description: "Readiness check",
      status: "published",
      sortOrder: 1,
      targeting: { grade: "Grade 3", subject: "Mathematics" },
      questions: [
        {
          id: "q-1",
          type: "scale",
          prompt: "Confidence",
          options: ["Low", "Medium", "High"],
          weight: 1,
        },
      ],
      updatedAt: 0,
    });

    const [, init] = fetchMock.mock.calls[0];
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8081/api/admin/readiness-templates");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toMatchObject({
      tenantId: "org-alpha",
      targeting: { grade: "Grade 3", subject: "Mathematics" },
    });
  });

  it("loads and updates the learner learning path through backend endpoints", async () => {
    const fetchMock = mockFetch({ modules: [], totalModules: 0 });

    await shiftoraApi.learningPath("org-beta", "learner@beta.school", "as-beta-g3a-math");

    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8081/api/users/me/learning-path?tenantId=org-beta&email=learner%40beta.school&assignmentId=as-beta-g3a-math",
    );

    await shiftoraApi.saveLearningProgress("org-beta", "learner@beta.school", {
      assignmentId: "as-beta-g3a-math",
      moduleId: "lm-beta-ai-foundation",
      unitId: "lu-beta-ai-foundation-1",
      status: "completed",
    });

    const [, init] = fetchMock.mock.calls[1];
    expect(fetchMock.mock.calls[1][0]).toBe(
      "http://localhost:8081/api/users/me/learning-progress?tenantId=org-beta&email=learner%40beta.school",
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toMatchObject({
      assignmentId: "as-beta-g3a-math",
      status: "completed",
    });
  });

  it("loads admin-controlled knowledge checks and completion rows", async () => {
    const fetchMock = mockFetch({ id: "kc-beta-g3-math", available: false });

    await shiftoraApi.knowledgeCheck("org-beta", "learner@beta.school");

    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8081/api/users/me/knowledge-check?tenantId=org-beta&email=learner%40beta.school",
    );

    await shiftoraApi.completionRows("org-beta");
    expect(fetchMock.mock.calls[1][0]).toBe(
      "http://localhost:8081/api/admin/completion?tenantId=org-beta",
    );
  });

  it("creates teachers and teaching contexts through admin endpoints", async () => {
    const fetchMock = mockFetch({ id: "u-new", tenantId: "org-beta" });

    await shiftoraApi.saveAdminUser({
      id: "",
      tenantId: "org-beta",
      email: "new.teacher@beta.school",
      name: "New Teacher",
      role: "TRAINEE",
      avatar: "NT",
      profile: { designation: "Subject Teacher", status: "invited" },
    });

    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8081/api/admin/users");
    expect(fetchMock.mock.calls[0][1].method).toBe("POST");

    await shiftoraApi.saveAdminAssignment({
      id: "as-1",
      userId: "u-new",
      tenantId: "org-beta",
      schoolName: "Beta School",
      grade: "Grade 3",
      division: "A",
      subject: "Mathematics",
      responsibility: "Subject Teacher",
      primaryAssignment: true,
      active: true,
      metadata: { board: "TN Board" },
    });

    expect(fetchMock.mock.calls[1][0]).toBe("http://localhost:8081/api/admin/assignments/as-1");
    expect(fetchMock.mock.calls[1][1].method).toBe("PUT");
  });

  it("surfaces backend error messages", async () => {
    mockFetch({ message: "Validation failed" }, false, 400);

    await expect(shiftoraApi.tenants()).rejects.toThrow("Validation failed");
  });
});
