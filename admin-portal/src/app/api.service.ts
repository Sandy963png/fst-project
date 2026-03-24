import { Injectable, signal, computed } from '@angular/core';
import { environment } from '../environments/environment';

export interface Message {
  _id?: string;
  senderName: string;
  senderRole: string; 
  text: string;
  createdAt?: string;
}

export interface Milestone {
  _id?: string;
  title: string;
  studentEmail: string;
  studentName: string;
  status: 'pending' | 'revision' | 'approved';
}

export interface Meeting {
  _id?: string;
  studentEmail: string;
  studentName: string;
  date: string;
  time: string;
  status: 'pending' | 'accepted' | 'rejected';
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private milestonesSignal = signal<any[]>([]);
  private meetingsSignal = signal<any[]>([]);
  private unreadSignal = signal<number>(0);

  private apiUrl = environment.apiUrl;
  
  messages = signal<Message[]>([]);
  milestones = signal<Milestone[]>([]);
  meetings = signal<Meeting[]>([]);

  constructor() { }

  async fetchMessages() {
    try {
      const res = await fetch(`${this.apiUrl}/messages`);
      if (res.ok) this.messages.set(await res.json());
    } catch (error) { console.error('Failed to fetch messages', error); }
  }

  async sendMessage(senderName: string, senderRole: string, text: string) {
    try {
      const res = await fetch(`${this.apiUrl}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderName, senderRole, text })
      });
      if (res.ok) {
        const newMsg = await res.json();
        this.messages.update(msgs => [...msgs, newMsg]);
        return true;
      }
      return false;
    } catch (error) { return false; }
  }

  async fetchAllMilestones() {
    try {
      const res = await fetch(`${this.apiUrl}/milestones`);
      if (res.ok) this.milestones.set(await res.json());
    } catch (error) { }
  }

  async updateMilestone(id: string, status: 'approved' | 'revision') {
    try {
      const res = await fetch(`${this.apiUrl}/milestones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        this.fetchAllMilestones();
        return true;
      }
      return false;
    } catch (error) { return false; }
  }

  async fetchAllMeetings() {
    try {
      const res = await fetch(`${this.apiUrl}/meetings`);
      if (res.ok) this.meetings.set(await res.json());
    } catch (error) { }
  }

  async updateMeeting(id: string, status: 'accepted' | 'rejected') {
    try {
      const res = await fetch(`${this.apiUrl}/meetings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        this.fetchAllMeetings();
        return true;
      }
      return false;
    } catch (error) { return false; }
  }
}
