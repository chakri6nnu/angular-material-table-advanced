export class Group {
  level = 0;
  parent: Group | null = null;
  expanded = true;
  totalCounts = 0;

  get visible(): boolean {
    return !this.parent || (this.parent.visible && this.parent.expanded);
  }
}

