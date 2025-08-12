/**
 * This file is part of @fca.gg/injector (git@github.com:FCAgreatgoals/injector).
 *
 * Copyright (C) 2025 SAS French Community Agency
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

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
