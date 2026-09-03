import { Router } from 'express';
import { departmentRegistry } from '../departments/registry.ts';
import { DepartmentId } from '../../shared/types/index.ts';

export const departmentRouter = Router();

departmentRouter.get('/', (req, res) => {
  res.json({
    success: true,
    departments: departmentRegistry.getAllDepartments(),
  });
});

departmentRouter.get('/:id', (req, res) => {
  const dept = departmentRegistry.getDepartment(req.params.id as DepartmentId);
  if (!dept) {
    return res.status(404).json({ success: false, error: 'Department not found' });
  }
  res.json({ success: true, department: dept });
});
