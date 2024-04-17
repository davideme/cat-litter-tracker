import {
  Cat,
  LitterEvent,
  Ref,
  addLitterEvent,
  fetchMostRecentLitterEvents,
  updateCat,
} from "../api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "../firebase";
import LitterEvents from "./LitterEvents";
import { useState } from "react";

function CatComponent({
  householdId,
  getCat,
}: {
  householdId?: string;
  getCat: (householdId: string) => Promise<Ref & Cat>;
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingLitter, setIsEditingLitter] = useState(false);
  const { isPending, isError, data, error } = useQuery({
    queryKey: ["catByHouseholdId", householdId],
    queryFn: () => getCat(householdId!),
    enabled: !!householdId,
  });
  const catMutation = useMutation({
    mutationFn: async (catRef: Ref & Cat) => {
      return await updateCat(householdId!, catRef.id, catRef);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["catByHouseholdId"],
      });
    },
  });
  const mutation = useMutation({
    mutationFn: async () => {
      return await addLitterEvent(householdId!, data?.id!, {
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
  ): Promise<LitterEvent[]> {
    return await fetchMostRecentLitterEvents(householdId, catId);
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
    setIsEditingName(true);
  }

  function handleSave(
    event: React.FocusEvent<HTMLHeadingElement, Element>
  ): void {
    setIsEditingName(false);
    const newName = event.target.textContent;
    if (!newName) {
      return;
    }
    catMutation.mutate({ id: data?.id!, name: newName });
  }

  function handleLitterTypeClick(): void {
    setIsEditingLitter(true);
  }

  function handleSaveLitterType(
    event: React.FocusEvent<HTMLSelectElement, Element>
  ): void {
    setIsEditingLitter(false);
    const newLitterType = event.target.value;
    if (!newLitterType) {
      return;
    }
    catMutation.mutate({ id: data?.id!, litterType: newLitterType });
  }

  return (
    <>
      <h3
        onClick={handleEdit}
        contentEditable={isEditingName}
        suppressContentEditableWarning={isEditingName}
        onBlur={handleSave}
      >
        {data?.name || "Luna"}
      </h3>
      <div
        style={{
          display: "inline-block",
          position: "relative",
        }}
      >
        {isEditingLitter ? (
          <select
            defaultValue={data?.litterType}
            onBlur={handleSaveLitterType}
            style={{
              display: "inline-block",
              cursor: "pointer",
            }}
          >
            <option value="">Select Litter Type</option>
            <option value="Clay">Clay</option>
            <option value="Silica">Silica</option>
            <option value="Pine">Pine</option>
            <option value="Corn">Corn</option>
          </select>
        ) : (
          <span
            style={{
              cursor: "pointer",
            }}
            onClick={handleLitterTypeClick}
          >
            {data?.litterType ?? "Clay"}
          </span>
        )}
      </div>
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
