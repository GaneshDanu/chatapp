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

const router = createBrowserRouter([
  {
    path: "/signup",
    element: <SignUp />
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/",
    element: isLoggedIn() ? <Home /> : <Login />
  },
  {
    path: "*",
    element: <Page404 />
  },
], {forceRefresh: true});



function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;
