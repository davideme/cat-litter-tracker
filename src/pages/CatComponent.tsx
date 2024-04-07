import {
  Cat,
  addLitterEvent,
  fetchMostRecentLitterEvents,
  updateCat,
} from "../api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { db, queryClient } from "../firebase";
import LitterEvents from "./LitterEvents";
import { useState } from "react";

function CatComponent({
  householdId,
  getCat,
}: {
  householdId?: string;
  getCat: (householdId: string) => Promise<Cat | undefined>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const { isPending, isError, data, error } = useQuery({
    queryKey: ["catByHouseholdId", householdId],
    queryFn: () => getCat(householdId!),
    enabled: !!householdId,
  });
  const catMutation = useMutation({
    mutationFn: async (cat: Cat) => {
      return await updateCat(db, householdId!, cat.id, { name: cat.name! });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["catByHouseholdId"],
      });
    },
  });
  const mutation = useMutation({
    mutationFn: async () => {
      return await addLitterEvent(db, householdId!, data?.id!, {
        name: "changed litter",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["litterEventByHouseholdIdAndCatId"],
      });
    },
  });

  async function loadLitterEvents(
    householdId: string,
    catId: string
  ): Promise<{ name: string; timestamp: string } | undefined> {
    return (await fetchMostRecentLitterEvents(db, householdId, catId))[0];
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

  function handleSave(
    event: React.FocusEvent<HTMLHeadingElement, Element>
  ): void {
    setIsEditing(false);
    const newName = event.target.textContent;
    if (!newName) {
      return;
    }
    catMutation.mutate({ id: data?.id!, name: newName });
  }

  return (
    <>
      <h3
        onClick={handleEdit}
        contentEditable={isEditing}
        suppressContentEditableWarning={isEditing}
        onBlur={handleSave}
      >
        {data?.name || "Luna"}
      </h3>
      <button
        id="changeLitter"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        Change Litter
      </button>
      {mutation.isError ? (
        <div>An error occurred: {mutation.error.message}</div>
      ) : null}
      <LitterEvents
        householdId={householdId}
        catId={data?.id}
        getLitterEvent={loadLitterEvents}
      />
    </>
  );
}

export default CatComponent;
