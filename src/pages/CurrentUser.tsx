import firebase from "firebase/compat/app";
import * as firebaseui from "firebaseui";
import {
  Household,
  addCatsToHousehold,
  addHousehold,
  fetchOwnedHousehold,
} from "../api";
import { useAuthState } from "react-firebase-hooks/auth";
import { useEffect } from "react";
import { auth } from "../firebase";
import UserDashboard from "./UserDashboard";

const CurrentUser = () => {
  const [user, loading, error] = useAuthState(auth);

  useEffect(() => {
    if (user || loading || error) {
      return;
    }
    // Initialize the FirebaseUI Widget using Firebase.
    var ui = new firebaseui.auth.AuthUI(auth);
    ui.start("#firebaseui-auth-container", {
      signInOptions: [firebase.auth.GoogleAuthProvider.PROVIDER_ID],
      signInSuccessUrl: "/",
    });
  }, [user, loading, error]);

  async function loadHousehold(userId: string): Promise<Household | undefined> {
    const household = (await fetchOwnedHousehold(userId))[0];
    if (!household) {
      const householdId = await addHousehold({
        roles: { [userId]: "owner" },
      });
      await addCatsToHousehold(householdId, [{}]);
      return (await fetchOwnedHousehold(userId))[0];
    }
    return household;
  }

  if (loading) {
    return (
      <div>
        <p>Initialising User...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <p>Error: {error.message}</p>
      </div>
    );
  }
  if (user) {
    return <UserDashboard user={user} getHousehold={loadHousehold} />;
  } else {
    return <UserSignedOut />;
  }
};

export default CurrentUser;

function UserSignedOut() {
  return <div id="firebaseui-auth-container"></div>;
}
