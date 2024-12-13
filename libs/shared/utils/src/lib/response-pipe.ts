async function util<T>(props: {
  res: Response;
  catchErrors: boolean;
}): Promise<T | undefined>;
async function util<T>(props: { res: Response }): Promise<T>;
async function util<T>(props: {
  res: Response;
  catchErrors?: boolean;
}): Promise<T | undefined> {
  if (!props.res.ok) {
    let json;

    try {
      json = await props.res.json();
    } catch (error) {
      //
    }

    if (json.data) {
      if ("catchErrors" in props && props.catchErrors) {
        console.error(props, json);

        return undefined;
      } else {
        throw new Error(json.data, {
          cause: props.res,
        });
      }
    } else {
      const requestError = new Error(
        `${props.res.status} | ${props.res.statusText}`,
        {
          cause: props.res,
        },
      );

      if ("catchErrors" in props && props.catchErrors) {
        console.error(`${props} | ${requestError.message} | ${requestError}`);

        return;
      } else {
        throw requestError;
      }
    }
  }

  const json = await props.res.json();

  if (json.error) {
    if ("catchErrors" in props && props.catchErrors) {
      console.error(props, json.error);

      return;
    } else {
      throw new Error(json.error.message);
    }
  }

  return json as T;
}

export { util };
