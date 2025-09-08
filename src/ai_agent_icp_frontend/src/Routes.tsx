import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Landing from './pages/Landing';
import User from './pages/User';

export default function AppRoutes(){
    const router = createBrowserRouter([
        {
            path : '/',
            element : <Landing/>
        },
        {
            path : '/user',
            element : <User/>
        }
    ])
    return <RouterProvider router={router}/>
}