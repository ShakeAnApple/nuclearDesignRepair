export class Class {
  constructor(title: string) {
    this.title = title;
  }

  title: string;
  parent: Class;
}
