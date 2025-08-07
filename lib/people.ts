export interface Person {
  id: string;
  name: string;
  email: string;
  team: string;
}

export const teams = [
  { id: "dev", name: "Development" },
  { id: "qa", name: "Quality Assurance" },
  { id: "design", name: "Design" },
  { id: "product", name: "Product" },
  { id: "marketing", name: "Marketing" },
];

export const people: Person[] = [
  {
    id: "people_3",
    name: "Mia Belle",
    email: "mia.belle@company.com",
    team: "design",
  },
  {
    id: "people_4",
    name: "Zoe Jane",
    email: "zoe.jane@company.com",
    team: "product",
  },
  {
    id: "people_5",
    name: "Ella Rae",
    email: "ella.rae@company.com",
    team: "marketing",
  },
  {
    id: "people_6",
    name: "Miles Parker",
    email: "miles.parker@company.com",
    team: "dev",
  },
  {
    id: "people_7",
    name: "Nora Quinn",
    email: "nora.quinn@company.com",
    team: "qa",
  },
  {
    id: "people_8",
    name: "Caleb Knox",
    email: "caleb.knox@company.com",
    team: "dev",
  },
  {
    id: "people_9",
    name: "Isla Brooke",
    email: "isla.brooke@company.com",
    team: "design",
  },
  {
    id: "people_10",
    name: "Cole Bennett",
    email: "cole.bennett@company.com",
    team: "product",
  },
  {
    id: "people_11",
    name: "Lucy Pearl",
    email: "lucy.pearl@company.com",
    team: "product",
  },
  {
    id: "people_12",
    name: "Maya Lynn",
    email: "maya.lynn@company.com",
    team: "marketing",
  },
  {
    id: "people_13",
    name: "Anna Leigh",
    email: "anna.leigh@company.com",
    team: "qa",
  },
  {
    id: "people_14",
    name: "Sadie Jo",
    email: "sadie.jo@company.com",
    team: "dev",
  },
  {
    id: "people_15",
    name: "Jack Ryan",
    email: "jack.ryan@company.com",
    team: "marketing",
  },
];

// Utility function to get team by id
export const getTeamById = (teamId: string) => {
  return teams.find((team) => team.id === teamId);
};
