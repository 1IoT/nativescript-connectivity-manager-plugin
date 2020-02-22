import {NgModule, NO_ERRORS_SCHEMA} from "@angular/core";
import {NativeScriptCommonModule} from "nativescript-angular/common";
import {HomeRoutingModule} from "./home-routing.module";
import {HomeComponent} from "./home.component";
import {ConnectivityManagerImpl} from "../../../../src";


@NgModule({
    imports: [
        NativeScriptCommonModule,
        HomeRoutingModule
    ],
    declarations: [
        HomeComponent
    ],
    providers: [
        ConnectivityManagerImpl
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class HomeModule {
}
