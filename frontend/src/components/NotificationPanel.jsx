export default function NotificationPanel(){

 return(

  <div
   className="
   glass-card
   rounded-2xl
   p-5
   border border-blue-900
   "
  >

   <h2 className="text-xl font-bold">
    Notifications
   </h2>

   <div className="space-y-3 mt-4">

    <div>
      Low stock alert
    </div>

    <div>
      Forecast updated
    </div>

    <div>
      New sales report generated
    </div>

   </div>

  </div>

 )
}
