import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import FloatingBackground from "../components/FloatingBackground";

export default function MainLayout({children}){

  return(
    <div className="dashboard-bg flex">

      <FloatingBackground/>
      
      <Sidebar/>

      <div className="flex-1">

        <Topbar/>

        {children}

      </div>

    </div>
  )
}