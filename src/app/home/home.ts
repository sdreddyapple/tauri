import { AfterViewInit, Component, OnInit } from '@angular/core';
import { gsap } from 'gsap';
@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, AfterViewInit {
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }
  ngAfterViewInit() {
    // Create a subtle floating effect for background elements
    gsap.to(".hero-bg-shape", {
      duration: 10,
      x: "random(-50, 50)",
      y: "random(-20, 20)",
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
  }
}