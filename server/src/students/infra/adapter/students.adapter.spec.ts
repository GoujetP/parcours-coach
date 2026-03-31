import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { StudentsAdapter } from './students.adapter';
import type { StudentProfileDto } from './dto/student-profile.dto';
import type { ResponseDto } from './dto/response.dto';

jest.mock('@google/genai');

describe('StudentsAdapter', () => {
  let adapter: StudentsAdapter;
  let mockGoogleGenAI: any;

  const mockStudentProfile: StudentProfileDto = {
    bacType: 'Bac Général',
    specialties: ['Mathématiques', 'NSI'],
    targetCourse: 'BUT Informatique',
    careerGoal: 'Développeur full-stack',
    hasAttendedJPO: true,
    hasAttendedFairs: false,
    hasSpokenWithAlumni: true,
    isInCordeeReussite: false,
    hasWorkExperience: true,
    workExperienceDetails: 'Stage 1 mois en mise en rayon',
    hasVolunteering: false,
    volunteeringDetails: '',
    hasSportOrArt: true,
    sportOrArtDetails: 'Basket en club depuis 5 ans',
    softSkills: ['Pragmatique', 'Organisé', 'Curieux'],
  };

  const mockApiResponse = {
    candidates: [
      {
        content: {
          parts: [
            {
              text: "C'est avec un vif intérêt que je soumets ma candidature...",
            },
          ],
          role: 'model',
        },
        finishReason: 'STOP',
        index: 0,
      },
    ],
    modelVersion: 'gemini-2.5-flash-lite',
    responseId: 'test-response-id-123',
    usageMetadata: {
      promptTokenCount: 839,
      candidatesTokenCount: 631,
      totalTokenCount: 1470,
      promptTokensDetails: [
        {
          modality: 'TEXT',
          tokenCount: 839,
        },
      ],
    },
  };

  beforeEach(async () => {
    mockGoogleGenAI = {
      models: {
        generateContent: jest.fn().mockResolvedValue(mockApiResponse),
      },
    };

    jest.mock('@google/genai', () => ({
      GoogleGenAI: jest.fn(() => mockGoogleGenAI),
    }));

    adapter = new StudentsAdapter();
    adapter['googleGenAI'] = mockGoogleGenAI;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(adapter).toBeDefined();
    });

    it('should initialize GoogleGenAI client', () => {
      expect(adapter['googleGenAI']).toBeDefined();
    });
  });

  describe('generate', () => {
    it('should call GoogleGenAI.models.generateContent with correct parameters', async () => {
      await adapter.generate(mockStudentProfile);

      expect(mockGoogleGenAI.models.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.5-flash-lite',
          config: expect.objectContaining({
            systemInstruction: expect.any(String),
            temperature: 0.2,
            maxOutputTokens: 1200,
          }),
        }),
      );
    });

    it('should return ResponseDto with mapped data', async () => {
      const result = await adapter.generate(mockStudentProfile);

      expect(result).toEqual(expect.objectContaining({
        content: expect.any(String),
        responseId: 'test-response-id-123',
        promptTokenCount: 839,
        candidatesTokenCount: 631,
        totalTokenCount: 1470,
      }));
    });

    it('should extract letter content from API response', async () => {
      const result = await adapter.generate(mockStudentProfile);

      expect(result.content).toBe(
        "C'est avec un vif intérêt que je soumets ma candidature...",
      );
    });

    it('should handle profile with empty specialties', async () => {
      const profileWithoutSpecialties: StudentProfileDto = {
        ...mockStudentProfile,
        specialties: [],
      };

      await adapter.generate(profileWithoutSpecialties);

      expect(mockGoogleGenAI.models.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.stringContaining('Non précisé'),
        }),
      );
    });

    it('should handle profile with empty soft skills', async () => {
      const profileWithoutSoftSkills: StudentProfileDto = {
        ...mockStudentProfile,
        softSkills: [],
      };

      await adapter.generate(profileWithoutSoftSkills);

      expect(mockGoogleGenAI.models.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.stringContaining('Sérieux, motivé'),
        }),
      );
    });

    it('should include targeted experiences in user message', async () => {
      await adapter.generate(mockStudentProfile);

      const callArgs =
        mockGoogleGenAI.models.generateContent.mock.calls[0][0];
      expect(callArgs.contents).toContain('Stage 1 mois en mise en rayon');
      expect(callArgs.contents).toContain('Basket en club depuis 5 ans');
    });

    it('should reject when GoogleGenAI throws error', async () => {
      const error = new Error('API Error');
      mockGoogleGenAI.models.generateContent.mockRejectedValueOnce(error);

      await expect(adapter.generate(mockStudentProfile)).rejects.toThrow(
        'API Error',
      );
    });

    it('should reject when generateContent fails', async () => {
      mockGoogleGenAI.models.generateContent.mockRejectedValueOnce(
        new Error('Network error'),
      );

      await expect(adapter.generate(mockStudentProfile)).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('mapResponseToDto', () => {
    it('should map API response to ResponseDto', () => {
      const result = adapter['mapResponseToDto'](mockApiResponse);

      expect(result).toEqual({
        content: "C'est avec un vif intérêt que je soumets ma candidature...",
        responseId: 'test-response-id-123',
        promptTokenCount: 839,
        candidatesTokenCount: 631,
        totalTokenCount: 1470,
      });
    });

    it('should handle null response gracefully', () => {
      const result = adapter['mapResponseToDto'](null);

      expect(result).toEqual({
        content: '',
        responseId: '',
        promptTokenCount: 0,
        candidatesTokenCount: 0,
        totalTokenCount: 0,
      });
    });

    it('should extract text from deeply nested structure', () => {
      const response = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: 'Nested text content',
                },
              ],
            },
          },
        ],
        responseId: 'nested-id',
        usageMetadata: {
          promptTokenCount: 100,
          candidatesTokenCount: 50,
          totalTokenCount: 150,
        },
      };

      const result = adapter['mapResponseToDto'](response);

      expect(result.content).toBe('Nested text content');
      expect(result.responseId).toBe('nested-id');
    });
  });

  describe('SYSTEM_PROMPT', () => {
    it('should contain security rules', () => {
      const systemPrompt = adapter['SYSTEM_PROMPT'];

      expect(systemPrompt).toContain('ANONYMAT ABSOLU');
      expect(systemPrompt).toContain('SÉCURITÉ ET REJET');
      expect(systemPrompt).toContain('ERREUR_DONNEES_INVALIDE');
    });

    it('should contain formatting requirements', () => {
      const systemPrompt = adapter['SYSTEM_PROMPT'];

      expect(systemPrompt).toContain('Markdown');
      expect(systemPrompt).toContain('4500 caractères');
      expect(systemPrompt).toContain('2250 caractères');
    });

    it('should specify vocabulary rules', () => {
      const systemPrompt = adapter['SYSTEM_PROMPT'];

      expect(systemPrompt).toContain('étudiant');
      expect(systemPrompt).toContain('Moi, je');
    });
  });

  describe('edge cases', () => {
    it('should handle profile with only required fields', async () => {
      const minimalProfile: StudentProfileDto = {
          bacType: 'Bac Général',
          targetCourse: 'BUT Informatique',
          specialties: [],
          hasAttendedJPO: false,
          hasAttendedFairs: false,
          hasSpokenWithAlumni: false,
          isInCordeeReussite: false,
          hasWorkExperience: false,
          hasVolunteering: false,
          hasSportOrArt: false,
          softSkills: []
      };

      const result = await adapter.generate(minimalProfile);

      expect(result).toBeDefined();
      expect(result.content).toBe(
        "C'est avec un vif intérêt que je soumets ma candidature...",
      );
    });

    it('should call generateContent once per request', async () => {
      await adapter.generate(mockStudentProfile);

      expect(mockGoogleGenAI.models.generateContent).toHaveBeenCalledTimes(1);
    });

    it('should return different responses for different profiles', async () => {
      const profile1: StudentProfileDto = {
          bacType: 'Bac Général',
          targetCourse: 'BUT Informatique',
          specialties: [],
          hasAttendedJPO: false,
          hasAttendedFairs: false,
          hasSpokenWithAlumni: false,
          isInCordeeReussite: false,
          hasWorkExperience: false,
          hasVolunteering: false,
          hasSportOrArt: false,
          softSkills: []
      };

      const profile2: StudentProfileDto = {
          bacType: 'Bac Technologique',
          targetCourse: 'Licence Informatique',
          specialties: [],
          hasAttendedJPO: false,
          hasAttendedFairs: false,
          hasSpokenWithAlumni: false,
          isInCordeeReussite: false,
          hasWorkExperience: false,
          hasVolunteering: false,
          hasSportOrArt: false,
          softSkills: []
      };

      await adapter.generate(profile1);
      await adapter.generate(profile2);

      expect(mockGoogleGenAI.models.generateContent).toHaveBeenCalledTimes(2);
      const firstCall =
        mockGoogleGenAI.models.generateContent.mock.calls[0][0].contents;
      const secondCall =
        mockGoogleGenAI.models.generateContent.mock.calls[1][0].contents;

      expect(firstCall).not.toBe(secondCall);
    });
  });
});
