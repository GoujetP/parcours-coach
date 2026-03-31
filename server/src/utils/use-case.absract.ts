export abstract class AbstractUseCase<I, O> {
  abstract execute(input: I): Promise<O> | O;
}