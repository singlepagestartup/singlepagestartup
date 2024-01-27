// "use client";

// import { useSelector } from "react-redux";
// import { useMemo } from "react";
// import { api as userApi } from "../../../../../../modules/sps-rbac/frontend/src/lib/redux/entities/user/api";
// import { populate as userPopulate } from "../../../../../../modules/sps-rbac/frontend/src/lib/redux/entities/user/populate";

// export function useMyProfile() {
//   const username = useSelector((state: any) => {
//     console.log(`🚀 ~ username ~ state:`, state);
//     return state.auth?.username;
//   });

//   // persistentAuthStore.getState().setAnonymusUsername({ username });

//   const {
//     data: myProfileByMe,
//     error: meError,
//     refetch: refetchMe,
//     isUninitialized,
//   } = userApi.useGetMeQuery(undefined, { skip: !username });

//   const { data: filledProfile, refetch: refetchProfileById } =
//     userApi.useGetByIdQuery(
//       { id: myProfileByMe?.id, populate: userPopulate },
//       {
//         skip: !myProfileByMe?.id,
//         pollingInterval: 60000,
//       },
//     );

//   const profile = useMemo(() => {
//     const me = username
//       ? { ...(myProfileByMe || {}), ...(filledProfile || {}) }
//       : {};

//     const refetch = () => {
//       refetchMe();
//       refetchProfileById();
//     };

//     return { me, refetch };
//   }, [myProfileByMe, filledProfile]);

//   return profile;
// }