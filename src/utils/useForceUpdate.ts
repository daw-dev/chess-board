import { useState, useCallback } from "react";

export default function useForceUpdate() {
  const [, setUpdate] = useState({});
  const forceUpdate = useCallback(() => setUpdate({}), []);
  return forceUpdate;
}
