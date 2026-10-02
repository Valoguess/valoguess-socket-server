export class AppError extends Error {

  constructor(
    message: string,
    public errorCode: string = "SOCKET_APP_ERROR",
    public status = 400,
  ) {
    super(message);
  }
}