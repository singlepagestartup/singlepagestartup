export function prepareFormDataToSend(params: { data: any }) {
  const { data } = params;

  const formData = new FormData();

  if (data) {
    const dataToSend = { ...data };

    Object.keys(dataToSend).forEach((key) => {
      if (
        Array.isArray(dataToSend[key]) &&
        dataToSend[key].every((v: unknown) => v instanceof File)
      ) {
        delete dataToSend[key];
      } else if (dataToSend[key] instanceof File) {
        delete dataToSend[key];
      }
    });
    formData.append("data", JSON.stringify(dataToSend));

    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (
        Array.isArray(value) &&
        value.every((v) => v instanceof File)
      ) {
        value.forEach((file: File, index: number) => {
          formData.append(`${key}_${index}`, file);
        });
      }
    });
  }

  return formData;
}
