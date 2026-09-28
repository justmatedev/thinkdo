import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
  type LayoutChangeEvent,
  type View as RNView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandLogo } from "../brand/BrandLogo";
import { font, fontSize, radius, spacing } from "../../lib/theme";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type AuthScreenShellProps = {
  heroBackground: string;
  logoColor: string;
  taglineColor: string;
  taglineOpacity: number;
  dockBackground: string;
  children: ReactNode;
};

type AuthScrollContextValue = {
  scrollFieldIntoView: (field: RNView | null) => void;
};

const AuthScrollContext = createContext<AuthScrollContextValue>({
  scrollFieldIntoView: () => {},
});

export function useAuthFieldScroll() {
  return useContext(AuthScrollContext);
}

export function AuthScreenShell({
  heroBackground,
  logoColor,
  taglineColor,
  taglineOpacity,
  dockBackground,
  children,
}: AuthScreenShellProps) {
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<RNView>(null);
  const scrollViewportHeight = useRef(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const scrollFieldIntoView = useCallback((field: RNView | null) => {
    if (!field || !scrollRef.current || !contentRef.current) return;
    if (scrollViewportHeight.current <= 0) return;

    field.measureLayout(
      contentRef.current,
      (_x, y, _w, fieldHeight) => {
        const fieldBottom = y + fieldHeight;
        const visibleBottom = scrollViewportHeight.current - spacing.lg;
        if (fieldBottom <= visibleBottom) return;

        scrollRef.current?.scrollTo({
          y: fieldBottom - visibleBottom,
          animated: true,
        });
      },
      () => {}
    );
  }, []);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const animate = () =>
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const showSub = Keyboard.addListener(showEvent, () => {
      animate();
      setKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      animate();
      setKeyboardVisible(false);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleScrollLayout = (event: LayoutChangeEvent) => {
    scrollViewportHeight.current = event.nativeEvent.layout.height;
  };

  return (
    <AuthScrollContext.Provider value={{ scrollFieldIntoView }}>
      <View style={[styles.screen, { backgroundColor: heroBackground }]}>
        {/* Edge-to-edge Android no longer resizes the window for the IME. */}
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <SafeAreaView
            edges={["top", "left", "right"]}
            style={[styles.hero, keyboardVisible && styles.heroCompact]}
          >
            <BrandLogo height={keyboardVisible ? 48 : 104} color={logoColor} />
            {!keyboardVisible ? (
              <Text
                style={[
                  styles.tagline,
                  { color: taglineColor, opacity: taglineOpacity },
                ]}
              >
                Abra, escreva, salve
              </Text>
            ) : null}
          </SafeAreaView>

          <View style={[styles.dock, { backgroundColor: dockBackground }]}>
            <SafeAreaView edges={["bottom"]}>
              <ScrollView
                ref={scrollRef}
                onLayout={handleScrollLayout}
                contentContainerStyle={styles.dockContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                automaticallyAdjustKeyboardInsets
                bounces={false}
                showsVerticalScrollIndicator={false}
              >
                <View ref={contentRef} style={styles.dockContent}>
                  {children}
                </View>
              </ScrollView>
            </SafeAreaView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </AuthScrollContext.Provider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  hero: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: "52%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  heroCompact: {
    flexShrink: 0,
    minHeight: 0,
    paddingVertical: spacing.sm,
  },
  tagline: {
    marginTop: spacing.md,
    fontFamily: font.regular,
    fontSize: fontSize.title,
    textAlign: "center",
  },
  dock: {
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
    flexShrink: 0,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  dockContent: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
});
