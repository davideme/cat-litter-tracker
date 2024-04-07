import { User } from "firebase/auth";
import { Cat, Household, fetchCatsOfHousehold } from "../api";
import { useQuery } from "@tanstack/react-query";
import { db } from "../firebase";
import CatComponent from "./CatComponent";

function UserDashboard({
  user,
  getHousehold: getHousehold,
}: {
  user: User;
  getHousehold: (userId: string) => Promise<Household | undefined>;
}) {
  const { isPending, isError, data, error } = useQuery({
    queryKey: ["householdByUserId", user.uid],
    queryFn: () => getHousehold(user.uid),
  });

  async function loadCat(householdId: string): Promise<Cat | undefined> {
    return (await fetchCatsOfHousehold(db, householdId))[0];
  }

  if (isPending) {
    return (
      <div>
        <p>Loading...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <p>Error: {error.message}</p>
      </div>
    );
  }

  return (
    <>
      <h2 id="householdName">{data?.name || "The Cat Palace"}</h2>
      <CatComponent householdId={data?.id} getCat={loadCat} />
    </>
  );
}

export default UserDashboard;
