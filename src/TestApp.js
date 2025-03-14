import React from 'react';
import { Card } from './components/RetroComponents';
import './styles.css';

function TestApp() {
  return (
    <div className="app">
      <h1>Test Card Component</h1>
      
      <Card header="Test Card">
        <p>This is a test of the custom Card component</p>
      </Card>
    </div>
  );
}

export default TestApp; 