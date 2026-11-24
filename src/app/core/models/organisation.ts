/** One organisation row shown in the list. */
export interface Organisation {
  id: number;
  name: string;
  status: string;
  members: number | string;
  owner: string;
  created: string;
}
