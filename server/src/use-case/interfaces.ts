/**
 * UseCase インターフェース
 * すべてのユースケースはこのインターフェースを実装する
 */
export interface UseCase<Input, Output> {
  execute(input: Input): Promise<Output>;
}
