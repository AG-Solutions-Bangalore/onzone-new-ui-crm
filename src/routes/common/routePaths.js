export const isAuthRoute = (path) => {
    return ["/", "/forget-password"].includes(path);
  };