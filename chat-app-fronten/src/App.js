import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import './App.css';
import Login from './components/auth/login';
import Page404 from './components/404';
import Home from './components/messenger/home';
import { isLoggedIn } from "./utils/genUtils";
import SignUp from "./components/auth/signup";
import Landing from "./components/landing";

const router = createBrowserRouter([
  {
    exact: true,
    path: "/",
    element: <Landing />
  },
  {
    path: "/signup",
    element: <SignUp />
  },
  {
    path: "/home",
    element: <Home />
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "*",
    element: <Page404 />
  },
]);



function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;
