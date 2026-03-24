import { Component, signal, inject, OnInit, computed, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { ApiService } from './api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, AfterViewChecked {
  @ViewChild('chatbox') private chatboxRef?: ElementRef;

  currentView = signal<'login' | 'register' | 'dashboard'>('login');
  activeTab = signal<'milestones' | 'meetings' | 'qa'>('milestones');
  currentUser = signal<any>(null);
  errorMsg = signal<string>('');

  apiService = inject(ApiService);

  pendingMilestones = computed(() => this.apiService.milestones().filter(m => m.status === 'pending'));
  revisionMilestones = computed(() => this.apiService.milestones().filter(m => m.status === 'revision'));
  approvedMilestones = computed(() => this.apiService.milestones().filter(m => m.status === 'approved'));

  pendingMeetings = computed(() => this.apiService.meetings().filter(m => m.status === 'pending'));
  acceptedMeetings = computed(() => this.apiService.meetings().filter(m => m.status === 'accepted'));

  ngOnInit() {
    setInterval(() => {
      if (this.currentView() === 'dashboard') {
        if (this.activeTab() === 'qa') this.apiService.fetchMessages();
        if (this.activeTab() === 'milestones') this.apiService.fetchAllMilestones();
        if (this.activeTab() === 'meetings') this.apiService.fetchAllMeetings();
      }
    }, 3000);
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom() {
    if (this.chatboxRef) {
      try {
        this.chatboxRef.nativeElement.scrollTop = this.chatboxRef.nativeElement.scrollHeight;
      } catch(err) { }
    }
  }

  async handleLogin(event: Event) {
    event.preventDefault();
    this.errorMsg.set('');
    
    const form = event.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      const res = await fetch('http://localhost:3000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        this.currentUser.set(data.admin);
        this.currentView.set('dashboard');
        this.apiService.fetchMessages();
        this.apiService.fetchAllMilestones();
        this.apiService.fetchAllMeetings();
      } else this.errorMsg.set(data.message || 'Login failed');
    } catch (err) { this.errorMsg.set('Server connection failed. Is the backend running?'); }
  }

  async handleRegister(event: Event) {
    event.preventDefault();
    this.errorMsg.set('');

    const form = event.target as HTMLFormElement;
    const fullName = (form.elements.namedItem('fullName') as HTMLInputElement).value;
    const department = (form.elements.namedItem('department') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      const res = await fetch('http://localhost:3000/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, department, email, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        this.currentUser.set(data.admin);
        this.currentView.set('dashboard');
        this.apiService.fetchMessages();
        this.apiService.fetchAllMilestones();
        this.apiService.fetchAllMeetings();
      } else this.errorMsg.set(data.message || 'Registration failed');
    } catch (err) { this.errorMsg.set('Server connection failed.'); }
  }

  async sendReply(textInput: HTMLInputElement) {
    const text = textInput.value;
    if (!text.trim()) return;
    const user = this.currentUser();
    if (user) {
      const success = await this.apiService.sendMessage(user.fullName, 'guide', text);
      if (success) textInput.value = ''; 
    }
  }

  async updateMilestone(id: string | undefined, status: 'approved' | 'revision') {
    if (id) await this.apiService.updateMilestone(id, status);
  }

  async updateMeeting(id: string | undefined, status: 'accepted' | 'rejected') {
    if (id) await this.apiService.updateMeeting(id, status);
  }

  switchView(view: 'login' | 'register' | 'dashboard') {
    this.currentView.set(view);
    this.errorMsg.set('');
  }

  switchTab(tab: 'milestones' | 'meetings' | 'qa') {
    this.activeTab.set(tab);
    if (tab === 'qa') this.apiService.fetchMessages();
    if (tab === 'milestones') this.apiService.fetchAllMilestones();
    if (tab === 'meetings') this.apiService.fetchAllMeetings();
  }

  logout() {
    this.currentUser.set(null);
    this.currentView.set('login');
  }
}
