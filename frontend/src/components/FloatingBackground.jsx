import {motion} from "framer-motion";

export default function FloatingBackground(){

 return(

 <>
  <motion.div

   animate={{
    y:[0,-40,0],
    x:[0,20,0]
   }}

   transition={{
    repeat:Infinity,
    duration:12
   }}

   className="
   absolute
   w-96
   h-96
   bg-purple-600
   blur-[150px]
   opacity-20
   rounded-full
   top-0
   left-0
   "
  />

  <motion.div

   animate={{
    y:[0,40,0]
   }}

   transition={{
    repeat:Infinity,
    duration:15
   }}

   className="
   absolute
   w-96
   h-96
   bg-pink-500
   blur-[150px]
   opacity-20
   rounded-full
   bottom-0
   right-0
   "
  />

 </>
 )
}