import { createNativeStackNavigator } from "@react-navigation/native-stack"
import SignIn from "../pages/signIn"
import SignUp from "../pages/signUp"
import Home from "../pages/home"
import Note from "../pages/note"
import { NoteProps } from "../types/note.type"
import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "../services/firebase"
import { UserActiveProps } from "../types/userActive.type"
import { useEnterUser } from "../scripts/enterUser"
import { View } from "react-native"
import Loading from "../components/loading"
import Tags from "../pages/tags"
import Menu from "../pages/menu"
import { colors } from "../theme/colors"
import navigationBarColor from "../scripts/navigationBarColor"
import Account from "../pages/account"

export type StackParamList = {
  signin: undefined
  signup: undefined
  home: undefined
  note: undefined | { data: NoteProps }
  tags: undefined
  menu: undefined
  account: undefined
}

const Stack = createNativeStackNavigator<StackParamList>()

export default function Routes() {
  const { enterUser } = useEnterUser()
  const [loading, setLoading] = useState(true)
  const [hasUser, setHasUser] = useState(false)

  useEffect(() => {
    navigationBarColor(colors.backgroundLight)
    const unsub = onAuthStateChanged(auth, (user) => {
      handleAuthStateChange(user)
    })
    return () => unsub()
  }, [])

  const handleAuthStateChange = async (user: any) => {
    if (user) {
      const userLogged: UserActiveProps = {
        displayName: user.displayName,
        email: user.email,
        emailVerified: user.emailVerified,
        uid: user.uid,
      }
      enterUser(userLogged)

      setHasUser(true)
      setLoading(false)
    } else {
      setHasUser(false)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.backgroundLight }}
      >
        <Loading color={colors.primary} />
      </View>
    )
  } else if (!loading) {
    return (
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: "fade" }}
        initialRouteName={hasUser ? "home" : "signin"}
      >
        <Stack.Screen name="signin" component={SignIn} />
        <Stack.Screen name="signup" component={SignUp} />
        <Stack.Screen name="home" component={Home} />
        <Stack.Screen name="note" component={Note} />
        <Stack.Screen name="tags" component={Tags} />
        <Stack.Screen name="menu" component={Menu} />
        <Stack.Screen name="account" component={Account} />
      </Stack.Navigator>
    )
  }
}
