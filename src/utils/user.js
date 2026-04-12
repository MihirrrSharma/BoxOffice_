import { v4 as uuidv4 } from "uuid";

export const getUserId = () => {
  let id = localStorage.getItem("userId");

  if (!id) {
    id = "user_" + uuidv4();
    localStorage.setItem("userId", id);
  }

  return id;
};