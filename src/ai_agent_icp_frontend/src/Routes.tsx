import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Landing from './pages/Landing';
export default function AppRoutes(){
    const router = createBrowserRouter([
        {
            path : '/',
            element : <Landing/>
        }
    ])
    return <RouterProvider router={router}/>
}