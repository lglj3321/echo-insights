import { ProjectForm } from '../ProjectForm';

export default function ProjectFormExample() {
  return (
    <div className="p-6 max-w-4xl">
      <ProjectForm
        onSubmit={(data) => console.log('Project created:', data)}
      />
    </div>
  );
}
