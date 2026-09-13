export interface IProjectPresentationPoint {
  title: string;
  detail: string;
}

export interface IProjectPresentationSlide {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  points: IProjectPresentationPoint[];
  image?: { src: string; alt: string };
  action?: { label: string; href: string; detail: string };
}

export interface IProjectPresentationData {
  name: string;
  projection: "singlepage" | "startup";
  logo: string;
  slides: IProjectPresentationSlide[];
  visual: {
    palette: {
      background: string;
      surface: string;
      foreground: string;
      accent: string;
      line: string;
    };
    displayType: string;
    bodyType: string;
  };
}
