import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppModule } from './app.module';

describe('AppModule Components', () => {
  let module: TestingModule;
  let controller: AppController;
  let service: AppService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    controller = module.get<AppController>(AppController);
    service = module.get<AppService>(AppService);
  });

  afterEach(async () => {
    await module?.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide AppController', () => {
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(AppController);
  });

  it('should provide AppService', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(AppService);
  });

  it('should have AppController with getHello method', () => {
    expect(typeof controller.getHello).toBe('function');
  });

  it('should have AppService with getHello method', () => {
    expect(typeof service.getHello).toBe('function');
  });

  it('should call service method from controller', () => {
    const result = controller.getHello();
    expect(result).toBe('Hello World!');
  });

  it('should return Hello World from service', () => {
    const result = service.getHello();
    expect(result).toBe('Hello World!');
  });
});

describe('AppModule', () => {
  it('should be defined', () => {
    expect(AppModule).toBeDefined();
    expect(typeof AppModule).toBe('function');
  });

  it('should have correct module structure', () => {
    expect(AppModule.name).toBe('AppModule');

    // Check that AppModule can be instantiated (basic smoke test)
    expect(() => new AppModule()).not.toThrow();
  });

  it('should be a valid NestJS module', () => {
    // Check metadata exists
    const imports = Reflect.getMetadata('imports', AppModule);
    const controllers = Reflect.getMetadata('controllers', AppModule);
    const providers = Reflect.getMetadata('providers', AppModule);

    expect(imports).toBeDefined();
    expect(controllers).toBeDefined();
    expect(providers).toBeDefined();

    // Verify AppController and AppService are included
    expect(controllers).toContain(AppController);
    expect(providers).toContain(AppService);
  });
});
