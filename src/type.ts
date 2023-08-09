export type Class = { new(...args: Array<any>): any }

export type InjectableKey = string | Class

export type LifecycleHooks = {
    onCreate?: (value: any) => void,
    onDestroy?: (value: any) => void
}

export type RegisterOptions<T> = {
    validate?: (value: any) => boolean,
} & (T extends Class ? ({
    singleton: true,
    lazy?: boolean
} | {
    singleton?: false,
}) & ({
    factory?: () => any,
    hooks?: LifecycleHooks
}) : any)

export type Registration = { value: any, instance?: any } & RegisterOptions<any>
