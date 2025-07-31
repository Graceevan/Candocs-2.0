import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const alertService = {
  success: (title = 'Success!', text) => {
    Swal.fire({
      icon: 'success',
      title,
      text,
      timer: 4000,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timerProgressBar: true,
      showCloseButton: true
    });
  },

  error: (title = 'Error', text) => {
    Swal.fire({
      icon: 'error',
      title,
      text,
      timer: 4000,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timerProgressBar: true,
      showCloseButton: true
    });
  }
};

export default alertService;
