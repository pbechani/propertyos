/**
 * HTML → React Native compatibility shim.
 *
 * Allows existing screen components that use HTML elements (div, p, button,
 * span, h1-h6, img, input, etc.) to render in React Native without a full
 * rewrite.  Import these named exports anywhere you would previously use the
 * corresponding HTML tag.
 *
 * Usage:
 *   import { Div, P, Button, Span, H1 } from '@/components/compat/dom';
 *   // … then just use <Div>, <P>, <Button> etc. in JSX.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  ViewProps,
  TextProps,
  TouchableOpacityProps,
  TextInputProps,
  ImageProps,
  ScrollViewProps,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';

// ── Helpers ───────────────────────────────────────────────────────────────────

type HtmlDivProps = ViewProps & { className?: string; style?: StyleProp<ViewStyle> };
type HtmlTextProps = TextProps & { className?: string; style?: StyleProp<TextStyle> };
type HtmlButtonProps = TouchableOpacityProps & {
  className?: string;
  style?: StyleProp<ViewStyle>;
  onClick?: () => void;
  onPress?: () => void;
};
type HtmlInputProps = TextInputProps & { className?: string };
type HtmlImgProps = ImageProps & { className?: string; src?: string; alt?: string };
type HtmlScrollProps = ScrollViewProps & { className?: string };

// ── Block / Layout ─────────────────────────────────────────────────────────────

/** <div> → <View> */
export const Div = ({ className, ...rest }: HtmlDivProps) => (
  <View {...rest} />
);

/** <section> → <View> */
export const Section = Div;

/** <article> → <View> */
export const Article = Div;

/** <main> → <View> */
export const Main = Div;

/** <header> → <View> */
export const Header = Div;

/** <footer> → <View> */
export const Footer = Div;

/** <nav> → <View> */
export const Nav = Div;

/** <aside> → <View> */
export const Aside = Div;

/** <form> → <View> (submit handled via button onPress) */
export const Form = Div;

// ── Scrollable ─────────────────────────────────────────────────────────────────

/** <ul> / <ol> → <ScrollView> */
export const Ul = ({ className, ...rest }: HtmlScrollProps) => (
  <ScrollView {...rest} />
);
export const Ol = Ul;

/** <li> → <View> */
export const Li = Div;

// ── Text ───────────────────────────────────────────────────────────────────────

/** <p> → <Text> */
export const P = ({ className, ...rest }: HtmlTextProps) => (
  <Text {...rest} />
);

/** <span> → <Text> */
export const Span = P;

/** <label> → <Text> */
export const Label = P;

/** <h1>–<h6> → <Text> (caller applies size via className / style) */
export const H1 = P;
export const H2 = P;
export const H3 = P;
export const H4 = P;
export const H5 = P;
export const H6 = P;

/** <strong> → <Text style={{ fontWeight: 'bold' }}> */
export const Strong = ({ style, ...rest }: HtmlTextProps) => (
  <Text style={[{ fontWeight: 'bold' }, style as TextStyle]} {...rest} />
);

/** <em> → <Text style={{ fontStyle: 'italic' }}> */
export const Em = ({ style, ...rest }: HtmlTextProps) => (
  <Text style={[{ fontStyle: 'italic' }, style as TextStyle]} {...rest} />
);

// ── Interactive ────────────────────────────────────────────────────────────────

/** <button> / <a> → <TouchableOpacity> */
export const Button = ({ className, onClick, onPress, ...rest }: HtmlButtonProps) => (
  <TouchableOpacity activeOpacity={0.75} onPress={onPress ?? onClick} {...rest} />
);

/** <a> → same as Button (navigation handled in onPress) */
export const A = Button;

// ── Form inputs ────────────────────────────────────────────────────────────────

/** <input> → <TextInput> */
export const Input = ({ className, ...rest }: HtmlInputProps) => (
  <TextInput {...rest} />
);

/** <textarea> → <TextInput multiline> */
export const Textarea = ({ className, ...rest }: HtmlInputProps) => (
  <TextInput multiline numberOfLines={4} {...rest} />
);

// ── Media ──────────────────────────────────────────────────────────────────────

/** <img> → <Image> */
export const Img = ({ src, alt, className, ...rest }: HtmlImgProps) => {
  const source = src ? { uri: src } : require('../../../assets/placeholder.png');
  return <Image source={source} accessibilityLabel={alt} {...rest} />;
};
