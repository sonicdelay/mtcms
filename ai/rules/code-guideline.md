# Guidelines

## Framework

* Deno formating and liniting is used
* Client holds the react 19 frontend 
* Server holds the express backend

## Common 
* each file one concern
* type definitions and other interfaces, enums and typescript declaration should be stored in client/src/models/*


## SD components
* should be prefixed with Sd in its name
* should not contain comments
* stored in client/src/components/Sd*.tsx
* should use only optional props "value", "config", "onChange", "eventIn" and "children" and "className"
* should only use "SdComponentProps" as defined in "client/src/models/sd-component-props.ts"
* incoming and outgoing events follow the format {type,payload}
* incoming use "eventIn" prop
* outgoing use "onChange" prop
* "config" argument holds the setup and 
* should not contain css classes from tailwindcss, but can receive "className" input
* css for a component is stored in "client/src/stylesheets/components.scss"

## Actions
{"type": string, ...rest}