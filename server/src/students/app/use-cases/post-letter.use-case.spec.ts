import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { PostLetterUseCase } from './post-letter.use-case';
import { InjectionTokenSpi } from '../../helper/injection-token.enum';
import type { StudentProfile } from '../model/student-profile.model';
import type { ResponseDto } from '../../infra/adapter/dto/response.dto';

describe('PostLetterUseCase', () => {
  let useCase: PostLetterUseCase;
  let mockAiGeneratorSpi: any;

  const mockStudentProfile: StudentProfile = {
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

  const mockResponse: ResponseDto = {
    content: 'Lettre de motivation générée...',
    responseId: 'response-id-123',
    promptTokenCount: 839,
    candidatesTokenCount: 631,
    totalTokenCount: 1470,
  };

  beforeEach(async () => {
    mockAiGeneratorSpi = {
      generate: jest.fn().mockResolvedValue(mockResponse),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostLetterUseCase,
        {
          provide: InjectionTokenSpi.AiGeneratorSpi,
          useValue: mockAiGeneratorSpi,
        },
      ],
    }).compile();

    useCase = module.get<PostLetterUseCase>(PostLetterUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(useCase).toBeDefined();
    });

    it('should inject AiGeneratorSpi dependency', () => {
      expect(useCase['aiGeneratorSpi']).toBeDefined();
    });
  });

  describe('execute', () => {
    it('should call aiGeneratorSpi.generate with student profile', async () => {
      await useCase.execute(mockStudentProfile);

      expect(mockAiGeneratorSpi.generate).toHaveBeenCalledWith(
        mockStudentProfile,
      );
      expect(mockAiGeneratorSpi.generate).toHaveBeenCalledTimes(1);
    });

    it('should return ResponseDto from aiGeneratorSpi.generate', async () => {
      const result = await useCase.execute(mockStudentProfile);

      expect(result).toEqual(mockResponse);
    });

    it('should return response with content', async () => {
      const result = await useCase.execute(mockStudentProfile);

      expect(result.content).toBeDefined();
      expect(result.content).toBe('Lettre de motivation générée...');
    });

    it('should return response with responseId', async () => {
      const result = await useCase.execute(mockStudentProfile);

      expect(result.responseId).toBeDefined();
      expect(result.responseId).toBe('response-id-123');
    });

    it('should return response with token information', async () => {
      const result = await useCase.execute(mockStudentProfile);

      expect(result.promptTokenCount).toBe(839);
      expect(result.candidatesTokenCount).toBe(631);
      expect(result.totalTokenCount).toBe(1470);
    });

    it('should handle minimal student profile', async () => {
      const minimalProfile: StudentProfile = {
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

      await useCase.execute(minimalProfile);

      expect(mockAiGeneratorSpi.generate).toHaveBeenCalledWith(minimalProfile);
    });

    it('should reject when aiGeneratorSpi throws error', async () => {
      const error = new Error('Generation failed');
      mockAiGeneratorSpi.generate.mockRejectedValueOnce(error);

      await expect(useCase.execute(mockStudentProfile)).rejects.toThrow(
        'Generation failed',
      );
    });

    it('should reject when aiGeneratorSpi returns error', async () => {
      mockAiGeneratorSpi.generate.mockRejectedValueOnce(
        new Error('API Error'),
      );

      await expect(useCase.execute(mockStudentProfile)).rejects.toThrow(
        'API Error',
      );
    });

    it('should handle different profiles independently', async () => {
      const profile1: StudentProfile = {
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

      const profile2: StudentProfile = {
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

      await useCase.execute(profile1);
      await useCase.execute(profile2);

      expect(mockAiGeneratorSpi.generate).toHaveBeenCalledTimes(2);
      expect(mockAiGeneratorSpi.generate).toHaveBeenNthCalledWith(1, profile1);
      expect(mockAiGeneratorSpi.generate).toHaveBeenNthCalledWith(2, profile2);
    });

    it('should call aiGeneratorSpi.generate exactly once per execute call', async () => {
      await useCase.execute(mockStudentProfile);

      expect(mockAiGeneratorSpi.generate).toHaveBeenCalledTimes(1);

      await useCase.execute(mockStudentProfile);

      expect(mockAiGeneratorSpi.generate).toHaveBeenCalledTimes(2);
    });
  });

  describe('AiGeneratorApi interface implementation', () => {
    it('should implement AiGeneratorApi interface', () => {
      expect(typeof useCase.execute).toBe('function');
    });

    it('should have execute method that returns Promise', async () => {
      const result = useCase.execute(mockStudentProfile);

      expect(result).toBeInstanceOf(Promise);
      await result;
    });
  });

  describe('edge cases', () => {
    it('should handle response with empty content', async () => {
      const emptyResponse: ResponseDto = {
        content: '',
        responseId: 'id',
        promptTokenCount: 0,
        candidatesTokenCount: 0,
        totalTokenCount: 0,
      };

      mockAiGeneratorSpi.generate.mockResolvedValueOnce(emptyResponse);

      const result = await useCase.execute(mockStudentProfile);

      expect(result.content).toBe('');
    });

    it('should handle large token counts', async () => {
      const largeTokenResponse: ResponseDto = {
        content: 'Text',
        responseId: 'id',
        promptTokenCount: 100000,
        candidatesTokenCount: 50000,
        totalTokenCount: 150000,
      };

      mockAiGeneratorSpi.generate.mockResolvedValueOnce(largeTokenResponse);

      const result = await useCase.execute(mockStudentProfile);

      expect(result.totalTokenCount).toBe(150000);
    });

    it('should maintain state across multiple executions', async () => {
      const profile1: StudentProfile = {
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

      const profile2: StudentProfile = {
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

      await useCase.execute(profile1);
      const result1 = await useCase.execute(profile1);

      await useCase.execute(profile2);
      const result2 = await useCase.execute(profile2);

      expect(result1).toEqual(mockResponse);
      expect(result2).toEqual(mockResponse);
    });
  });
});
