export interface Result<T> {
    isSuccess: boolean;
    value : T;
    error : string | null
}
