import { User } from "firebase/auth";
import { Cat, Household, fetchCatsOfHousehold, updateHousehold } from "../api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "../firebase";
import CatComponent from "./CatComponent";
import { useState } from "react";

function UserDashboard({
  user,
  getHousehold: getHousehold,
}: {
  user: User;
  getHousehold: (userId: string) => Promise<Household | undefined>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const { isPending, isError, data, error } = useQuery({
    queryKey: ["householdByUserId", user.uid],
    queryFn: () => getHousehold(user.uid),
  });
  const mutation = useMutation({
    mutationFn: async (household: Household) => {
      return await updateHousehold(household.id, { name: household.name! });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["catByHouseholdId"],
      });
    },
  });

  async function loadCat(householdId: string): Promise<Cat | undefined> {
    return (await fetchCatsOfHousehold(householdId))[0];
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

  function handleEdit(): void {
    setIsEditing(true);
  }

  function handleSave(event: React.FocusEvent<HTMLHeadingElement>): void {
    setIsEditing(false);
    const newName = event.target.textContent;
    if (!newName) {
      return;
    }
    mutation.mutate({ id: data?.id!, name: newName });
  }

  return (
    <>
      {mutation.isError && (
        <div>An error occurred: {mutation.error.message}</div>
      )}
      <h2
        id="householdName"
        onClick={handleEdit}
        contentEditable={isEditing}
        suppressContentEditableWarning={isEditing}
        onBlur={handleSave}
      >
        {data?.name || "The Cat Palace"}
      </h2>
      <CatComponent householdId={data?.id} getCat={loadCat} />
    </>
  );
}

export default UserDashboard;
