import axios from "axios";

export default ({ req }) => {
  if (typeof window === "undefined") {
    // we are on the server
    console.log("We are on the server!");

    return axios.create({
      baseURL: "http://ingress-nginx-controller.kube-system.svc.cluster.local",
      headers: req.headers,
    });

  } else {
    // we are on the browser
    console.log("We are on the browser!");

    return axios.create({
      baseURL: "/",
    });
  }
};
