import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { LetterController } from './students.controller';
import { InjectionTokenApi } from '../../helper/injection-token.enum';
import type { StudentProfileDto } from '../adapter/dto/student-profile.dto';
import type { ResponseDto } from '../adapter/dto/response.dto';

describe('LetterController', () => {
  let controller: LetterController;
  let aiGeneratorApi: any;

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

  const mockResponse: ResponseDto = {
    content: 'Lettre de motivation générée...',
    responseId: 'jNTLae2sOIWUvdIPmIuQwQc',
    promptTokenCount: 839,
    candidatesTokenCount: 631,
    totalTokenCount: 1470,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LetterController],
      providers: [
        {
          provide: InjectionTokenApi.AiGeneratorApi,
          useValue: {
            execute: jest.fn().mockResolvedValue(mockResponse),
          },
        },
      ],
    }).compile();

    controller = module.get<LetterController>(LetterController);
    aiGeneratorApi = module.get(InjectionTokenApi.AiGeneratorApi);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generate', () => {
    it('should call aiGeneratorApi.execute with the student profile', async () => {
      await controller.generate(mockStudentProfile);

      expect(aiGeneratorApi.execute).toHaveBeenCalledWith(mockStudentProfile);
      expect(aiGeneratorApi.execute).toHaveBeenCalledTimes(1);
    });

    it('should return the response from aiGeneratorApi', async () => {
      const result = await controller.generate(mockStudentProfile);

      expect(result).toEqual(mockResponse);
      expect(result.responseId).toBe('jNTLae2sOIWUvdIPmIuQwQc');
      expect(result.totalTokenCount).toBe(1470);
    });

    it('should return response with correct content when aiGeneratorApi succeeds', async () => {
      const result = await controller.generate(mockStudentProfile);

      expect(result.content).toBeDefined();
      expect(result.promptTokenCount).toBeGreaterThan(0);
      expect(result.candidatesTokenCount).toBeGreaterThan(0);
    });

    it('should reject when aiGeneratorApi throws an error', async () => {
      const error = new Error('API Error');
      aiGeneratorApi.execute.mockRejectedValueOnce(error);

      await expect(controller.generate(mockStudentProfile)).rejects.toThrow(
        'API Error',
      );
    });

    it('should handle partial student profile data', async () => {
      const partialProfile: StudentProfileDto = {
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

      await controller.generate(partialProfile);

      expect(aiGeneratorApi.execute).toHaveBeenCalledWith(partialProfile);
    });
  });
});
