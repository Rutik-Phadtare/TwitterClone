import React from 'react'

export const Landing = () => {
    const [showauth, setShowauth] = React.useState(false);
    const [authmode, setAuthmode] = React.useState<"login" | "signup">("login");  
    const openAuth = (mode: "login" | "signup") => {
        setAuthmode(mode);
        setShowauth(true);
    }
  return (
    <div>Landing</div>
  )
}
export default Landing