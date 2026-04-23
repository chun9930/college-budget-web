import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Mainpage from './pages/Mainpage.jsx';
import Loginpage from './pages/Loginpage.jsx';
import ExpenseRecords from './pages/ExpenseRecords.jsx';
import BudgetStatus from './pages/BudgetStatus.jsx';
import Statistics from './pages/Statistics.jsx';
import MyPage from './pages/MyPage.jsx';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Mainpage />} />
        <Route path="/login" element={<Loginpage />} />
        <Route path="/expense-records" element={<ExpenseRecords />} />
        <Route path="/budget-status" element={<BudgetStatus />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/my-page" element={<MyPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
