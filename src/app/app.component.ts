import { Component } from "@angular/core";
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { invoke } from "@tauri-apps/api/core";
import { AddUser } from "../components/add-user/add-user";
import { AddLine } from "../components/add-line/add-line";
import { Assignment } from "../components/assignment/assignment";
import { getCurrentWindow } from '@tauri-apps/api/window';
@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AddUser, AddLine, Assignment],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent {
  greetingMessage = "";

  greet(event: SubmitEvent, name: string): void {
    event.preventDefault();

    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    invoke<string>("greet", { name }).then((text) => {
      this.greetingMessage = text;
    });
  }
  async closeWindow(){
    const appWindow = getCurrentWindow();
    await appWindow.close();
  }
}
