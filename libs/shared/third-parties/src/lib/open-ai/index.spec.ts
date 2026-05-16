/**
 * BDD Suite: OpenAI audio transcription wrapper.
 *
 * Given: RBAC audio ingestion needs reusable OpenAI speech-to-text access.
 * When: callers transcribe an uploadable audio file through the shared wrapper.
 * Then: the wrapper selects the configured model, returns normalized text, and rejects empty transcripts.
 */

describe("OpenAI audio transcription wrapper", () => {
  const importService = async (props?: { transcriptionModel?: string }) => {
    jest.resetModules();

    const create = jest.fn();
    const OpenAI = jest.fn().mockImplementation(() => {
      return {
        audio: {
          transcriptions: {
            create,
          },
        },
        responses: {
          create: jest.fn(),
        },
      };
    });

    jest.doMock(
      "@sps/shared-utils",
      () => {
        return {
          OPEN_AI_API_KEY: "test-open-ai-api-key",
          OPEN_AI_TRANSCRIPTION_MODEL: props?.transcriptionModel,
          AUDIO_TRANSCRIPTION_DEFAULT_MODEL: "gpt-4o-transcribe",
        };
      },
      {
        virtual: true,
      },
    );

    jest.doMock("openai", () => {
      return {
        __esModule: true,
        default: OpenAI,
      };
    });

    const { Service } = await import("./index");

    return {
      create,
      Service,
    };
  };

  afterEach(() => {
    jest.dontMock("@sps/shared-utils");
    jest.dontMock("openai");
    jest.restoreAllMocks();
  });

  /**
   * BDD Scenario
   * Given: no transcription model override is configured.
   * When: audio transcription runs without an explicit model.
   * Then: the wrapper uses gpt-4o-transcribe and returns trimmed transcript text.
   */
  it("uses the default transcription model and trims returned text", async () => {
    const { create, Service } = await importService();
    const file = new File(["audio"], "voice.webm", {
      type: "audio/webm",
    });

    create.mockResolvedValue({
      text: "  hello from a voice note  ",
      usage: {
        seconds: 3,
        type: "duration",
      },
    });

    const service = new Service();
    const result = await service.transcribeAudio({
      file,
    });

    expect(create).toHaveBeenCalledWith({
      file,
      language: undefined,
      model: "gpt-4o-transcribe",
      prompt: undefined,
    });
    expect(result).toEqual({
      metadata: {
        model: "gpt-4o-transcribe",
        usage: {
          seconds: 3,
          type: "duration",
        },
      },
      text: "hello from a voice note",
    });
  });

  /**
   * BDD Scenario
   * Given: the deployment config provides OPEN_AI_TRANSCRIPTION_MODEL.
   * When: audio transcription runs without an explicit per-call model.
   * Then: the wrapper uses the configured model.
   */
  it("uses OPEN_AI_TRANSCRIPTION_MODEL when configured", async () => {
    const { create, Service } = await importService({
      transcriptionModel: "gpt-4o-mini-transcribe",
    });

    create.mockResolvedValue({
      text: "configured model transcript",
    });

    const service = new Service();
    const file = new File(["audio"], "voice.webm", {
      type: "audio/webm",
    });

    await service.transcribeAudio({
      file,
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4o-mini-transcribe",
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: a caller needs to override transcription model details for one request.
   * When: language, prompt, and model are passed to transcribeAudio.
   * Then: those fields are forwarded to the OpenAI transcription API.
   */
  it("allows a per-call model and transcription hints", async () => {
    const { create, Service } = await importService({
      transcriptionModel: "gpt-4o-mini-transcribe",
    });

    create.mockResolvedValue({
      text: "bonjour",
    });

    const service = new Service();
    const file = new File(["audio"], "voice.webm", {
      type: "audio/webm",
    });

    await service.transcribeAudio({
      file,
      language: "fr",
      model: "whisper-1",
      prompt: "Casual Telegram voice note.",
    });

    expect(create).toHaveBeenCalledWith({
      file,
      language: "fr",
      model: "whisper-1",
      prompt: "Casual Telegram voice note.",
    });
  });

  /**
   * BDD Scenario
   * Given: OpenAI returns only whitespace for a transcription.
   * When: the wrapper normalizes the response.
   * Then: it throws before callers can mark the message as completed.
   */
  it("rejects empty transcription text", async () => {
    const { create, Service } = await importService();

    create.mockResolvedValue({
      text: "   ",
    });

    const service = new Service();
    const file = new File(["audio"], "voice.webm", {
      type: "audio/webm",
    });

    await expect(
      service.transcribeAudio({
        file,
      }),
    ).rejects.toThrow("OpenAI transcription returned empty text");
  });
});
