import 'reflect-metadata';
import {
  getControllers,
  getProviders,
} from './students.helper';
import { LetterController } from '../infra/controller/students.controller';
import { PostLetterUseCase } from '../app/use-cases/post-letter.use-case';
import { StudentsAdapter } from '../infra/adapter/students.adapter';
import { InjectionTokenApi, InjectionTokenSpi } from './injection-token.enum';

describe('StudentsHelper', () => {
  describe('getControllers', () => {
    it('should return array of controllers', () => {
      const controllers = getControllers();

      expect(Array.isArray(controllers)).toBe(true);
      expect(controllers.length).toBeGreaterThan(0);
    });

    it('should include LetterController', () => {
      const controllers = getControllers();

      expect(controllers).toContain(LetterController);
    });

    it('should return exactly one controller', () => {
      const controllers = getControllers();

      expect(controllers).toHaveLength(1);
    });

    it('should return LetterController as first element', () => {
      const controllers = getControllers();

      expect(controllers[0]).toBe(LetterController);
    });
  });

  describe('getProviders', () => {
    it('should return array of providers', () => {
      const providers = getProviders();

      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBeGreaterThan(0);
    });

    it('should return exactly two providers', () => {
      const providers = getProviders();

      expect(providers).toHaveLength(2);
    });

    it('should have correct structure for each provider', () => {
      const providers = getProviders();

      providers.forEach((provider) => {
        expect(provider).toHaveProperty('provider');
        expect(provider).toHaveProperty('useClass');
      });
    });

    describe('AI Generator API Provider', () => {
      it('should have AiGeneratorApi token', () => {
        const providers = getProviders();
        const apiProvider = providers.find(
          (p) => p.provider === InjectionTokenApi.AiGeneratorApi,
        );

        expect(apiProvider).toBeDefined();
      });

      it('should use PostLetterUseCase class', () => {
        const providers = getProviders();
        const apiProvider = providers.find(
          (p) => p.provider === InjectionTokenApi.AiGeneratorApi,
        );

        expect(apiProvider?.useClass).toBe(PostLetterUseCase);
      });

      it('should have correct structure', () => {
        const providers = getProviders();
        const apiProvider = providers.find(
          (p) => p.provider === InjectionTokenApi.AiGeneratorApi,
        );

        expect(apiProvider).toEqual({
          provider: InjectionTokenApi.AiGeneratorApi,
          useClass: PostLetterUseCase,
        });
      });
    });

    describe('AI Generator SPI Provider', () => {
      it('should have AiGeneratorSpi token', () => {
        const providers = getProviders();
        const spiProvider = providers.find(
          (p) => p.provider === InjectionTokenSpi.AiGeneratorSpi,
        );

        expect(spiProvider).toBeDefined();
      });

      it('should use StudentsAdapter class', () => {
        const providers = getProviders();
        const spiProvider = providers.find(
          (p) => p.provider === InjectionTokenSpi.AiGeneratorSpi,
        );

        expect(spiProvider?.useClass).toBe(StudentsAdapter);
      });

      it('should have correct structure', () => {
        const providers = getProviders();
        const spiProvider = providers.find(
          (p) => p.provider === InjectionTokenSpi.AiGeneratorSpi,
        );

        expect(spiProvider).toEqual({
          provider: InjectionTokenSpi.AiGeneratorSpi,
          useClass: StudentsAdapter,
        });
      });
    });

    it('should have both API and SPI providers', () => {
      const providers = getProviders();
      const hasApiProvider = providers.some(
        (p) => p.provider === InjectionTokenApi.AiGeneratorApi,
      );
      const hasSpiProvider = providers.some(
        (p) => p.provider === InjectionTokenSpi.AiGeneratorSpi,
      );

      expect(hasApiProvider).toBe(true);
      expect(hasSpiProvider).toBe(true);
    });

    it('should map different tokens to different classes', () => {
      const providers = getProviders();
      const apiProvider = providers.find(
        (p) => p.provider === InjectionTokenApi.AiGeneratorApi,
      );
      const spiProvider = providers.find(
        (p) => p.provider === InjectionTokenSpi.AiGeneratorSpi,
      );

      expect(apiProvider?.useClass).not.toBe(spiProvider?.useClass);
    });

    it('should maintain provider order', () => {
      const providers = getProviders();

      expect(providers[0].provider).toBe(InjectionTokenApi.AiGeneratorApi);
      expect(providers[1].provider).toBe(InjectionTokenSpi.AiGeneratorSpi);
    });
  });

  describe('Dependency Injection Integration', () => {
    it('should provide all necessary dependencies for module setup', () => {
      const controllers = getControllers();
      const providers = getProviders();

      expect(controllers).toBeDefined();
      expect(providers).toBeDefined();
      expect(controllers.length).toBeGreaterThan(0);
      expect(providers.length).toBeGreaterThan(0);
    });

    it('should not have duplicate providers', () => {
      const providers = getProviders();
      const providerTokens = providers.map((p) => p.provider);

      const uniqueTokens = new Set(providerTokens);
      expect(uniqueTokens.size).toBe(providerTokens.length);
    });

    it('should use valid injection tokens', () => {
      const providers = getProviders();

      providers.forEach((provider) => {
        expect(provider.provider).toBeDefined();
        expect(typeof provider.provider).toBe('string');
      });
    });

    it('should reference existing classes', () => {
      const providers = getProviders();

      providers.forEach((provider) => {
        expect(typeof provider.useClass).toBe('function');
      });
    });
  });

  describe('Module Configuration', () => {
    it('should provide complete NestJS module configuration', () => {
      const config = {
        controllers: getControllers(),
        providers: getProviders(),
      };

      expect(config.controllers).toBeDefined();
      expect(config.providers).toBeDefined();
      expect(Array.isArray(config.controllers)).toBe(true);
      expect(Array.isArray(config.providers)).toBe(true);
    });

    it('should support NestJS module decorator pattern', () => {
      const controllers = getControllers();
      const providers = getProviders();

      // Simulate NestJS module configuration
      const moduleConfig = {
        controllers,
        providers,
      };

      expect(moduleConfig).toHaveProperty('controllers');
      expect(moduleConfig).toHaveProperty('providers');
      expect(Array.isArray(moduleConfig.controllers)).toBe(true);
      expect(Array.isArray(moduleConfig.providers)).toBe(true);
    });
  });
});
